import { useState } from "react";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import Card from "../../components/layout/Card";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    console.log({
      email,
      password,
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <Card title="Login">
        <form
          onSubmit={handleSubmit}
          className="flex w-80 flex-col gap-4"
        >
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />

          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />

          <Button type="submit">
            Login
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default LoginPage;